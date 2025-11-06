import './GreekDecoration.css'

const GreekDecoration = ({ type = 'column', size = 'medium' }) => {
  const sizeClass = `decoration-${size}`
  
  if (type === 'column') {
    return (
      <svg 
        className={`greek-decoration ${sizeClass}`}
        viewBox="0 0 100 200" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="columnGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f0f0f0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Column base */}
        <rect x="35" y="180" width="30" height="20" fill="url(#columnGradient)" opacity="0.6" />
        {/* Column shaft */}
        <rect x="40" y="30" width="20" height="150" fill="url(#columnGradient)" opacity="0.6" />
        {/* Capital (Doric style) */}
        <rect x="35" y="20" width="30" height="15" fill="url(#columnGradient)" opacity="0.7" />
        <rect x="32" y="20" width="36" height="8" fill="url(#columnGradient)" opacity="0.5" />
      </svg>
    )
  }
  
  if (type === 'statue') {
    return (
      <svg 
        className={`greek-decoration ${sizeClass}`}
        viewBox="0 0 100 200" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="statueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#e0e0e0" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="50" cy="30" r="15" fill="url(#statueGradient)" opacity="0.5" />
        {/* Body */}
        <rect x="35" y="45" width="30" height="80" fill="url(#statueGradient)" opacity="0.5" rx="5" />
        {/* Base */}
        <rect x="25" y="125" width="50" height="20" fill="url(#statueGradient)" opacity="0.4" rx="3" />
        {/* Arms outline */}
        <ellipse cx="20" cy="70" rx="8" ry="25" fill="url(#statueGradient)" opacity="0.4" />
        <ellipse cx="80" cy="70" rx="8" ry="25" fill="url(#statueGradient)" opacity="0.4" />
      </svg>
    )
  }
  
  if (type === 'scroll') {
    return (
      <svg 
        className={`greek-decoration ${sizeClass}`}
        viewBox="0 0 120 80" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f5f5f5" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Scroll body */}
        <rect x="20" y="15" width="80" height="50" fill="url(#scrollGradient)" opacity="0.6" rx="3" />
        {/* Scroll rolls */}
        <ellipse cx="20" cy="40" rx="8" ry="25" fill="url(#scrollGradient)" opacity="0.5" />
        <ellipse cx="100" cy="40" rx="8" ry="25" fill="url(#scrollGradient)" opacity="0.5" />
        {/* Text lines */}
        <line x1="30" y1="30" x2="90" y2="30" stroke="rgba(13, 94, 175, 0.3)" strokeWidth="1.5" />
        <line x1="30" y1="40" x2="90" y2="40" stroke="rgba(13, 94, 175, 0.3)" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="90" y2="50" stroke="rgba(13, 94, 175, 0.3)" strokeWidth="1.5" />
      </svg>
    )
  }
  
  return null
}

export default GreekDecoration

