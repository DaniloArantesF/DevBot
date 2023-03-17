import classes from '@styles/UserCard.module.css';
import AvatarIcon from './Avatar';
import { useDashboardContext } from '@lib/context/dashboardContext';
import DropdownMenu, {
  DropdownMenuCheckbox,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownRadioGroup,
} from './DropdownMenu';
import { getDiscordAvatar } from 'shared/utils';

function UserCard() {
  const { user } = useDashboardContext();

  return (
    user && (
      <div className={classes.root}>
        <AvatarIcon src={getDiscordAvatar('user', user!.id, user!.avatar)} alt="John Doe" />
        <div className={classes.info}>
          <div>{user?.username}</div>
          <div>#{user?.discriminator}</div>
        </div>
        <div className={classes.options}>
          <DropdownMenu>
            <DropdownMenuCheckbox label={'Slick checkbox'} onChange={(value) => {}} />
            <DropdownMenuItem label={'Nice menu item'} />
            <DropdownMenuSeparator />
            <DropdownMenuLabel label={'Cool options'} />
            <DropdownRadioGroup
              options={[
                { value: 'opt1', label: 'Option 1', default: true },
                { value: 'opt2', label: 'Option 2' },
              ]}
            />
          </DropdownMenu>
        </div>
      </div>
    )
  );
}

export default UserCard;
