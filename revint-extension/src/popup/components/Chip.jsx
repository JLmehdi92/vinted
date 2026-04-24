import React from 'react';

function Chip({ children, variant = 'default', style, onClick }) {
  const variantClass =
    variant === 'default' ? '' : ` ${variant}`;

  return (
    <span
      className={`chip${variantClass}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

export default Chip;
