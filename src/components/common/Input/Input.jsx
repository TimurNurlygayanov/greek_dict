import './Input.css'

const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const inputClasses = [
    'input',
    `input-${size}`,
    error && 'input-error',
    icon && `input-with-icon-${iconPosition}`,
    fullWidth && 'input-full-width',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper-full-width' : ''}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      <div className="input-container">
        {icon && iconPosition === 'left' && (
          <span className="input-icon input-icon-left">{icon}</span>
        )}

        <input
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <span className="input-icon input-icon-right">{icon}</span>
        )}
      </div>

      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}

export default Input
