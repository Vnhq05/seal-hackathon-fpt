import * as React from "react";
import { SealInput } from "./seal-input";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <SealInput ref={ref} {...props} />,
);

Input.displayName = "Input";
