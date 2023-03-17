import ScrollArea from './ScrollArea';
import classes from '@styles/AvatarList.module.css';
import AvatarIcon from './Avatar';
import Link from 'next/link';

interface AvatarListProps {
  direction?: 'row' | 'column';
  items: { src: string; alt: string; href?: string }[];
}

function AvatarList({ items = [], direction = 'column' }: AvatarListProps) {
  return (
    <div className={classes.container}>
      <ScrollArea>
        <div>
          {items.map(({ alt, src, href }, index) =>
            href ? (
              <Link key={index} className={classes.item} href={href}>
                <AvatarIcon src={src} alt={alt} clickable />
              </Link>
            ) : (
              <div key={index} className={classes.item}>
                <AvatarIcon src={src} alt={alt} />
              </div>
            ),
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AvatarList;
