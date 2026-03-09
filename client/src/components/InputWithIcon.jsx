import React from 'react';

/**
 * A reusable input field with a leading icon.
 *
 * @param {{
 *   icon: React.ComponentType<import('react').SVGProps<SVGSVGElement>>;
 *   type?: string;
 *   placeholder?: string;
 *   value: string;
 *   onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
 *   className?: string;
 *   [key: string]: any;
 * }} props
 */
export default function InputWithIcon({
  icon: Icon,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  ...rest
}) {
  return (
    <div className="relative w-full">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input pl-10 w-full ${className}`}
        {...rest}
      />
    </div>
  );
}
