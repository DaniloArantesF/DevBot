import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import classes from '@styles/Checkbox.module.css';

interface CheckboxProps {
  id: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}

function Checkbox({ defaultChecked = false, id, children }: CheckboxProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <CheckboxPrimitive.Root className={classes.root} defaultChecked={defaultChecked} id={id}>
        <CheckboxPrimitive.Indicator className={classes.indicator}>
          <CheckIcon />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label className={classes.label} htmlFor={id}>
        {children}
      </label>
    </div>
  );
}

export default Checkbox;
