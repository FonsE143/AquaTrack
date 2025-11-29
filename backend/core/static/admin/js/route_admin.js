(function($) {
    $(document).ready(function() {
        // Store all barangay options when page loads
        var allBarangayOptions = $('#id_barangay').html();
        
        // Function to filter barangays based on selected municipality
        function filterBarangays() {
            var municipalityId = $('#id_municipality').val();
            
            if (municipalityId) {
                // Hide all options first
                $('#id_barangay option').hide();
                
                // Show only options that belong to the selected municipality
                $('#id_barangay option[value=""]').show(); // Show empty option
                $('#id_barangay option[data-municipality="' + municipalityId + '"]').show();
                
                // If current selection is not in the filtered list, clear it
                var currentSelection = $('#id_barangay').val();
                if (currentSelection && !$('#id_barangay option[value="' + currentSelection + '"]').is(':visible')) {
                    $('#id_barangay').val('');
                }
            } else {
                // Show all options when no municipality is selected
                $('#id_barangay option').show();
            }
        }
        
        // Add data attributes to barangay options to identify their municipalities
        $('#id_barangay option').each(function() {
            var optionValue = $(this).val();
            if (optionValue) {
                // Find the municipality for this barangay
                // We'll need to get this information from the server
                // For now, we'll add a placeholder
                $(this).attr('data-municipality', '');
            }
        });
        
        // Load barangay-municipality mappings
        function loadBarangayMappings() {
            // This would ideally fetch the mappings from the server
            // For now, we'll simulate this with a simple approach
            $.ajax({
                url: '../../api/barangays/',
                method: 'GET',
                success: function(data) {
                    // Create a mapping of barangay ID to municipality ID
                    var mappings = {};
                    var barangays = Array.isArray(data) ? data : (data.results || []);
                    
                    $.each(barangays, function(index, barangay) {
                        if (barangay.id && barangay.municipality) {
                            mappings[barangay.id] = barangay.municipality;
                        }
                    });
                    
                    // Add data-municipality attributes to options
                    $('#id_barangay option').each(function() {
                        var optionValue = $(this).val();
                        if (optionValue && mappings[optionValue]) {
                            $(this).attr('data-municipality', mappings[optionValue]);
                        }
                    });
                    
                    // Apply initial filter
                    filterBarangays();
                },
                error: function() {
                    // If AJAX fails, fall back to showing all options
                    $('#id_barangay option').show();
                }
            });
        }
        
        // Trigger filter when municipality changes
        $('#id_municipality').change(filterBarangays);
        
        // Load mappings and apply initial filter
        loadBarangayMappings();
    });
})(django.jQuery);