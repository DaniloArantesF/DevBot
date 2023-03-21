import classes from '@styles/Modal.module.css';
import utilClasses from '@styles/utils.module.css';
import * as Dialog from '@radix-ui/react-dialog';
import Button, { ButtonProps } from '../primitives/Button';
import { Cross2Icon } from '@radix-ui/react-icons';

interface ModalProps {
  btn?: ButtonProps;
  children: React.ReactNode;
  description: string;
  heading: string;
}

function CloseButton() {
  return (
    <Dialog.Close asChild>
      <button className={classes.iconButton} aria-label="Close">
        <Cross2Icon />
      </button>
    </Dialog.Close>
  );
}

function Modal({ btn, children, description, heading }: ModalProps) {
  const btnLabel = btn?.label || 'Open';
  const btnType = btn?.type || 'button';
  const onClick = btn?.onClick;
  const btnStyle = btn?.style || {};

  return (
    <div className={classes.root}>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button label={btnLabel} type={btnType} style={btnStyle} onClick={onClick} />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className={utilClasses.overlay} />
          <Dialog.Content className={classes.content}>
            <Dialog.Title className={classes.title}>
              <p>{heading}</p>
            </Dialog.Title>
            <Dialog.Description className={classes.description}>{description}</Dialog.Description>
            <>{children}</>
            <CloseButton />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default Modal;
