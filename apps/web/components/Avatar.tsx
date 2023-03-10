import * as Avatar from '@radix-ui/react-avatar';
import classes from '@styles/Avatar.module.css';

interface AvatarProps {
  src: string;
  alt: string;
}

const AvatarIcon = ({ src, alt }: AvatarProps) => (
  <div className={classes.container}>
    <Avatar.Root className={classes.root}>
      <Avatar.Image className={classes.image} src={src} alt={alt} />
      <Avatar.Fallback className={classes.fallback} delayMs={600}>
        {
          // get first letter of each word in alt and capitalize it
          alt
            ?.split(' ')
            .map((word) => word[0].toUpperCase())
            .join('')
        }
      </Avatar.Fallback>
    </Avatar.Root>
  </div>
);

export default AvatarIcon;
