// Field form: label + (wajib *) + kontrol + helper/error (PRD §9).
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  helper,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-body-md font-medium text-text-primary">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-body-sm text-error">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-body-sm text-text-secondary">{helper}</p>
      ) : null}
    </div>
  );
}
