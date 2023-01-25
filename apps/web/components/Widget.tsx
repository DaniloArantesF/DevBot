import Separator from './Separator';
import ScrollArea from '@components/ScrollArea';
import classes from '@styles/Widget.module.css';

type WidgetProps = React.ComponentProps<'div'> & {
  title: string;
  children: React.ReactNode;
  rows?: number | 'auto';
  cols?: number | 'auto';
};

function Widget({ title, children, rows = 'auto', cols = 'auto', style, ...props }: WidgetProps) {
  return (
    <div
      {...props}
      style={{ gridRow: `span ${rows}`, gridColumn: `span ${cols}`, ...style }}
      className={`${classes.container} ${props.className}`}
    >
      <p className={classes.header}>{title}</p>
      <Separator />

      <ScrollArea>
        <div className={classes.body}>{children}</div>
      </ScrollArea>
    </div>
  );
}

export default Widget;
