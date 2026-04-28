import React from 'react';

function Toggle({ on, onClick }) {
  return (
    <div
      className={`toggle${on ? ' on' : ''}`}
      onClick={onClick}
    />
  );
}

export default Toggle;
