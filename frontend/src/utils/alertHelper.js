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