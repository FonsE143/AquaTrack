// Utility function to create styled alerts
export const createStyledAlert = (type, title, message, duration = 5000) => {
  // Remove any existing alerts with the same type to prevent stacking
  const existingAlerts = document.querySelectorAll('.custom-alert');
  existingAlerts.forEach(alert => {
    if (alert.classList.contains(`alert-${type}`)) {
      alert.remove();
    }
  });

  const alert = document.createElement('div');
  
  // Enhanced base classes with better styling
  alert.className = 'custom-alert alert alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow-lg border-0';
  alert.style.zIndex = '9999';
  alert.style.minWidth = '350px';
  alert.style.maxWidth = '400px';
  alert.style.transform = 'translateX(0)';
  alert.style.transition = 'all 0.3s ease-out';
  alert.style.borderRadius = '0.5rem';
  alert.style.overflow = 'hidden';
  
  // Type-specific styling with enhanced colors and effects
  switch (type) {
    case 'success':
      alert.className += ' alert-success';
      alert.style.borderLeft = '5px solid #198754';
      alert.style.boxShadow = '0 4px 12px rgba(25, 135, 84, 0.25)';
      break;
    case 'error':
      alert.className += ' alert-danger';
      alert.style.borderLeft = '5px solid #dc3545';
      alert.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.25)';
      break;
    case 'warning':
      alert.className += ' alert-warning';
      alert.style.borderLeft = '5px solid #ffc107';
      alert.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.25)';
      break;
    case 'info':
    default:
      alert.className += ' alert-info';
      alert.style.borderLeft = '5px solid #0dcaf0';
      alert.style.boxShadow = '0 4px 12px rgba(13, 202, 240, 0.25)';
      break;
  }
  
  // Icon based on type with enhanced styling
  let iconClass = '';
  let iconBg = '';
  switch (type) {
    case 'success':
      iconClass = 'bi-check-circle-fill text-white';
      iconBg = 'bg-success';
      break;
    case 'error':
      iconClass = 'bi-exclamation-triangle-fill text-white';
      iconBg = 'bg-danger';
      break;
    case 'warning':
      iconClass = 'bi-exclamation-triangle-fill text-white';
      iconBg = 'bg-warning';
      break;
    case 'info':
    default:
      iconClass = 'bi-info-circle-fill text-white';
      iconBg = 'bg-info';
      break;
  }
  
  alert.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="alert-icon-container d-flex align-items-center justify-content-center ${iconBg}" 
           style="width: 48px; height: 100%; min-height: 100%; position: absolute; left: 0; top: 0;">
        <i class="bi ${iconClass} fs-4"></i>
      </div>
      <div class="ps-5 w-100">
        <div class="d-flex align-items-start">
          <div class="flex-grow-1">
            <strong class="fs-6">${title}</strong>
            <div class="mt-1 small">${message}</div>
          </div>
          <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <div class="progress mt-2" style="height: 3px;">
          <div class="progress-bar progress-bar-striped progress-bar-animated ${type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-info'}" 
               role="progressbar" style="width: 100%; transition: width ${duration}ms linear;"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(alert);
  
  // Animate progress bar
  const progressBar = alert.querySelector('.progress-bar');
  setTimeout(() => {
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }, 100);
  
  // Auto dismiss after duration
  setTimeout(() => {
    if (alert && alert.parentNode) {
      alert.style.transform = 'translateX(100%)';
      alert.style.opacity = '0';
      setTimeout(() => {
        if (alert && alert.parentNode) {
          alert.remove();
        }
      }, 300);
    }
  }, duration);
  
  // Close button event listener
  const closeBtn = alert.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      alert.style.transform = 'translateX(100%)';
      alert.style.opacity = '0';
      setTimeout(() => {
        if (alert && alert.parentNode) {
          alert.remove();
        }
      }, 300);
    });
  }
  
  return alert;
};

// Custom confirm dialog with optional input field
export const createStyledConfirm = (title, message, onConfirm, onCancel, options = {}) => {
  // Remove any existing confirm dialogs
  const existingConfirms = document.querySelectorAll('.custom-confirm');
  existingConfirms.forEach(confirm => confirm.remove());

  const confirmDialog = document.createElement('div');
  
  // Enhanced base classes with better styling
  confirmDialog.className = 'custom-confirm modal fade show position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
  confirmDialog.style.zIndex = '10000';
  confirmDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  confirmDialog.style.display = 'block';
  
  // Check if we need an input field
  const hasInput = options.inputLabel && options.inputType;
  const inputHtml = hasInput ? `
    <div class="mb-3">
      <label class="form-label">${options.inputLabel}</label>
      <input type="${options.inputType || 'text'}" class="form-control" id="confirm-input" placeholder="${options.inputPlaceholder || ''}" 
             ${options.inputRequired ? 'required' : ''} value="${options.inputValue || ''}" ${options.inputMax ? `max="${options.inputMax}"` : ''}>
      ${options.inputHelpText ? `<div class="form-text">${options.inputHelpText}</div>` : ''}
    </div>
  ` : '';
  
  // Check if we need additional inputs
  const additionalInputsHtml = options.additionalInputs && Array.isArray(options.additionalInputs) ? 
    options.additionalInputs.map(input => `
      <div class="mb-3">
        <label class="form-label">${input.label}</label>
        <input type="${input.type || 'text'}" class="form-control" name="${input.name || ''}" placeholder="${input.placeholder || ''}" 
               ${input.required ? 'required' : ''} value="${input.value || ''}" ${input.min !== undefined ? `min="${input.min}"` : ''} ${input.max !== undefined ? `max="${input.max}"` : ''}>
        ${input.helpText ? `<div class="form-text">${input.helpText}</div>` : ''}
      </div>
    `).join('') : '';

  confirmDialog.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 0.75rem;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body pt-0">
          <p class="mb-0">${message}</p>
          ${inputHtml}
          ${additionalInputsHtml}
        </div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary">Confirm</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmDialog);
  
  // Add event listeners
  const closeBtn = confirmDialog.querySelector('.btn-close');
  const cancelBtn = confirmDialog.querySelector('.btn-outline-secondary');
  const confirmBtn = confirmDialog.querySelector('.btn-primary');
  const inputField = confirmDialog.querySelector('#confirm-input');
  const additionalInputs = confirmDialog.querySelectorAll('input[name]');
  
  const closeDialog = () => {
    confirmDialog.style.opacity = '0';
    setTimeout(() => {
      if (confirmDialog && confirmDialog.parentNode) {
        confirmDialog.remove();
      }
      if (onCancel) onCancel();
    }, 300);
  };
  
  const confirmAction = () => {
    let inputValue = null;
    const additionalValues = {};
    
    // Handle primary input
    if (inputField) {
      inputValue = inputField.value;
      // Validate if required
      if (options.inputRequired && !inputValue.trim()) {
        inputField.classList.add('is-invalid');
        return;
      }
      
      // Validate max value if specified
      if (options.inputMax !== undefined) {
        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue) && numValue > options.inputMax) {
          inputField.classList.add('is-invalid');
          // Show error message
          const errorDiv = document.createElement('div');
          errorDiv.className = 'invalid-feedback d-block';
          errorDiv.textContent = `Value cannot exceed ${options.inputMax}`;
          // Insert after input field if not already present
          if (!inputField.parentNode.querySelector('.invalid-feedback')) {
            inputField.parentNode.appendChild(errorDiv);
          }
          return;
        }
      }
    }
    
    // Handle additional inputs
    additionalInputs.forEach(input => {
      const name = input.getAttribute('name');
      if (name) {
        additionalValues[name] = input.value;
        
        // Validate required fields
        if (input.hasAttribute('required') && !input.value.trim()) {
          input.classList.add('is-invalid');
          return;
        }
        
        // Validate min/max values
        const minValue = input.getAttribute('min');
        const maxValue = input.getAttribute('max');
        if (minValue !== null || maxValue !== null) {
          const numValue = parseFloat(input.value);
          if (!isNaN(numValue)) {
            if (minValue !== null && numValue < parseFloat(minValue)) {
              input.classList.add('is-invalid');
              const errorDiv = document.createElement('div');
              errorDiv.className = 'invalid-feedback d-block';
              errorDiv.textContent = `Value cannot be less than ${minValue}`;
              if (!input.parentNode.querySelector('.invalid-feedback')) {
                input.parentNode.appendChild(errorDiv);
              }
              return;
            }
            if (maxValue !== null && numValue > parseFloat(maxValue)) {
              input.classList.add('is-invalid');
              const errorDiv = document.createElement('div');
              errorDiv.className = 'invalid-feedback d-block';
              errorDiv.textContent = `Value cannot exceed ${maxValue}`;
              if (!input.parentNode.querySelector('.invalid-feedback')) {
                input.parentNode.appendChild(errorDiv);
              }
              return;
            }
          }
        }
      }
    });
    
    // Check if there are validation errors
    const invalidFields = confirmDialog.querySelectorAll('.is-invalid');
    if (invalidFields.length > 0) {
      return;
    }
    
    confirmDialog.style.opacity = '0';
    setTimeout(() => {
      if (confirmDialog && confirmDialog.parentNode) {
        confirmDialog.remove();
      }
      // Pass both primary input and additional inputs to onConfirm
      if (onConfirm) {
        if (Object.keys(additionalValues).length > 0) {
          onConfirm({
            deliveredQuantity: inputValue,
            ...additionalValues
          });
        } else {
          onConfirm(inputValue);
        }
      }
    }, 300);
  };
  
  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
  if (confirmBtn) confirmBtn.addEventListener('click', confirmAction);
  
  // Focus input field if it exists
  if (inputField) {
    inputField.focus();
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmAction();
      }
    });
  }
  
  return confirmDialog;
};

// Utility function to auto-dismiss alerts with animation
export const dismissAlert = (alert, delay = 3000) => {
  setTimeout(() => {
    if (alert && alert.parentNode) {
      alert.style.transform = 'translateX(100%)';
      alert.style.opacity = '0';
      setTimeout(() => {
        if (alert && alert.parentNode) {
          alert.remove();
        }
      }, 300);
    }
  }, delay);
};

// Wrapper functions for different alert types
export const showAlertSuccess = (title, message, duration) => {
  return createStyledAlert('success', title, message, duration);
};

export const showAlertError = (title, message, duration) => {
  return createStyledAlert('error', title, message, duration);
};

export const showAlertWarning = (title, message, duration) => {
  return createStyledAlert('warning', title, message, duration);
};

export const showAlertInfo = (title, message, duration) => {
  return createStyledAlert('info', title, message, duration);
};