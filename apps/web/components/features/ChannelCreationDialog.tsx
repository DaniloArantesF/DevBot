import Button from '@components/Button';
import ControlGroup from '@components/ControlGroup';
import Dialog from '@components/Dialog';
import TextInput from '@components/TextInput';
import { useRef } from 'react';

interface ChannelCreationDialogProps {}

function ChannelCreationDialog() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog title="Create a new channel">
      <ControlGroup>
        <TextInput ref={inputRef} id="input1" placeholder="Channel Name" />
        <Button label={'Create'} variant="slim" justify={'right'} onClick={() => {}} />
      </ControlGroup>
    </Dialog>
  );
}

export default ChannelCreationDialog;
