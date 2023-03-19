import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import Button from './Button';
import classes from '@styles/Dialog.module.css';

interface DialogProps {
  title: string;
  children: React.ReactNode[] | React.ReactNode;
  description?: string;
}

function Dialog({ children, title, description }: DialogProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button label={title} variant={'slim'} />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={classes.overlay} />
        <DialogPrimitive.Content className={classes.content}>
          <DialogPrimitive.Title className={classes.title}>{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className={classes.description}>
              {description}
            </DialogPrimitive.Description>
          )}
          <fieldset className={classes.fieldset}>{children}</fieldset>
          <div style={{ display: 'flex', marginTop: '1.5rem', justifyContent: 'flex-start' }}>
            <DialogPrimitive.Close asChild>
              <Button label="Save & Close" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant={'slim'} className={classes.close}>
              <Cross2Icon />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default Dialog;
