import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import classes from '@styles/Select.module.css';

type SelectProps = {
  placeholder?: string;
  label?: string;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
} & React.ComponentPropsWithRef<typeof SelectPrimitive.Item>;

interface SelectGroupProps {
  label: string;
  children: React.ReactNode;
}

export function SelectGroup({ children, label }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className={classes.label}>{label}</SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <SelectPrimitive.Item {...props} ref={forwardedRef} className={classes.item}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className={classes.indicator}>
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  },
);
SelectItem.displayName = 'SelectItem';

export const SelectSeparator = () => <SelectPrimitive.Separator className={classes.separator} />;

const Select = ({ children, placeholder, label, ...props }: SelectProps) => (
  <SelectPrimitive.Root {...props}>
    <SelectPrimitive.Trigger className={classes.trigger} aria-label={label}>
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon className={classes.triggerIcon}>
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className={classes.content}>
        <SelectPrimitive.ScrollUpButton className={classes.scrollButton}>
          <ChevronUpIcon />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className={classes.viewport}>{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className={classes.scrollButton}>
          <ChevronDownIcon />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);
export default Select;
