import React, { useMemo, useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  DotFilledIcon,
  CheckIcon,
  ChevronRightIcon,
  DotsVerticalIcon,
} from '@radix-ui/react-icons';
import classes from '@styles/DropdownMenu.module.css';

interface DropdownSubMenuProps {
  children?: React.ReactNode[];
}

interface DropdownCheckboxProps {
  checked?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}

interface DropdownRadioGroupProps {
  onChange?: (value: string) => void;
  options: { value: string; label: string; default?: boolean }[];
}

interface DropdownMenuProps {
  children: React.ReactNode[];
}

export function DropdownSubMenu({ children }: DropdownSubMenuProps) {
  <DropdownMenuPrimitive.Sub>
    <DropdownMenuPrimitive.SubTrigger className={classes.subTrigger}>
      More nice options
      <div className={classes.alignRight}>
        <ChevronRightIcon />
      </div>
    </DropdownMenuPrimitive.SubTrigger>

    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        className={classes.subContent}
        sideOffset={2}
        alignOffset={-5}
      >
        {children}
      </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
  </DropdownMenuPrimitive.Sub>;
}

export function DropdownRadioGroup({ options, onChange }: DropdownRadioGroupProps) {
  const defaultOption = useMemo(() => options.find((opt) => opt.default) ?? options[0], [options]);
  return (
    <DropdownMenuPrimitive.RadioGroup value={defaultOption.value} onValueChange={onChange}>
      {options.map((opt, index) => (
        <DropdownMenuPrimitive.RadioItem
          key={opt.value}
          className={classes.radio}
          value={opt.value}
        >
          <DropdownMenuPrimitive.ItemIndicator className={classes.itemIndicator}>
            <DotFilledIcon />
          </DropdownMenuPrimitive.ItemIndicator>
          {opt.label}
        </DropdownMenuPrimitive.RadioItem>
      ))}
    </DropdownMenuPrimitive.RadioGroup>
  );
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className={classes.separator} />;
}

interface DropdownMenuItemProps {
  label: string;
  onClick?: () => void;
}

export function DropdownMenuItem({ label, onClick }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item className={classes.item} onClick={onClick}>
      {label}
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownMenuCheckbox({
  checked: initialCheck,
  label,
  onChange,
}: DropdownCheckboxProps) {
  const [checked, setChecked] = useState(initialCheck ?? false);

  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={classes.checkbox}
      checked={checked}
      onCheckedChange={setChecked}
      onClick={() => onChange?.(!checked)}
    >
      <DropdownMenuPrimitive.ItemIndicator className={classes.itemSeparator}>
        <CheckIcon />
      </DropdownMenuPrimitive.ItemIndicator>
      {label}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({ label }: { label: string }) {
  return (
    <DropdownMenuPrimitive.Label className={classes.label}>{label}</DropdownMenuPrimitive.Label>
  );
}

function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button className={classes.button} /*aria-label="Customise options" */>
          <DotsVerticalIcon />
        </button>
      </DropdownMenuPrimitive.Trigger>

      {/* Portal Content */}
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content className={classes.content} sideOffset={5}>
          {children}
          {/* <DropdownMenuPrimitive.Arrow className={classes.arrow} /> */}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export default DropdownMenu;
