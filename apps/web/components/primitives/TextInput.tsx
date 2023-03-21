import classes from '@styles/TextInput.module.css';
import { forwardRef } from 'react';

interface TextInputProps {
  id: string;
  placeholder?: string;
  type?: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  return (
    <div className={classes.root}>
      <input
        ref={ref}
        className={classes.input}
        id={props.id}
        type={props.type || 'text'}
        placeholder={props.placeholder || ''}
      />
    </div>
  );
});

TextInput.displayName = 'TextInput';
export default TextInput;
