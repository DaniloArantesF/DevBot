import Button from '@components/primitives/Button';
import ControlGroup from '@components/ui/ControlGroup';
import Dialog from '@components/ui/Dialog';
import TextInput from '@components/primitives/TextInput';
import { useMemo, useRef, useState } from 'react';
import Select, { SelectGroup, SelectItem } from '@components/primitives/Select';
import { PlusIcon } from '@radix-ui/react-icons';
import utilClasses from '@styles/utils.module.css';

interface ChannelCreationDialogProps {}

function ChannelCreationDialog() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categories = useMemo(
    () =>
      ['Category1', 'Category2', 'Category3'].map((c) => ({ label: c, value: c.toLowerCase() })),
    [],
  );

  function submitChannel() {
    console.log({
      name: inputRef.current?.value,
      category,
    });
  }

  return (
    <Dialog title="Create a new channel" triggerLabel={<PlusIcon />}>
      <Select placeholder="Parent Category" onValueChange={setCategory}>
        <SelectGroup label={'Categories'}>
          {categories.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </Select>
      <ControlGroup>
        <TextInput ref={inputRef} id="channel-name" placeholder="Channel Name" />
        <Button label={'Create'} justify={'right'} onClick={submitChannel} />
      </ControlGroup>

      <div className={utilClasses.error}>{error && <p>{error}</p>}</div>
    </Dialog>
  );
}

export default ChannelCreationDialog;
