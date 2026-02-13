import React, {
  type MouseEventHandler,
  type ReactNode,
  type UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '@/lib/utils';

type AnimationMode = 'scale' | 'fadeUp';

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
  animation?: AnimationMode;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
  animation = 'scale',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, once: true });

  const hiddenState = animation === 'fadeUp' ? { y: 12, opacity: 0 } : { scale: 0.7, opacity: 0 };
  const visibleState = animation === 'fadeUp' ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 };
  const duration = animation === 'fadeUp' ? 0.35 : 0.2;

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={hiddenState}
      animate={inView ? visibleState : hiddenState}
      transition={{ duration, delay }}
      className={cn('mb-4', onClick ? 'cursor-pointer' : undefined)}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListProps<T = string> {
  items?: T[];
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  staggerDelay?: number;
  animation?: AnimationMode;
  scrollable?: boolean;
  maxHeightClass?: string;
  containerWidthClass?: string;
}

const DEFAULT_ITEMS = [
  'Item 1',
  'Item 2',
  'Item 3',
  'Item 4',
  'Item 5',
  'Item 6',
  'Item 7',
  'Item 8',
  'Item 9',
  'Item 10',
  'Item 11',
  'Item 12',
  'Item 13',
  'Item 14',
  'Item 15',
];

const AnimatedList = <T,>({
  items,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  renderItem,
  getItemKey,
  staggerDelay = 0.1,
  animation = 'scale',
  scrollable = true,
  maxHeightClass = 'max-h-[400px]',
  containerWidthClass = 'w-[500px]',
}: AnimatedListProps<T>) => {
  const resolvedItems = useMemo<T[]>(() => {
    if (items) return items;
    return DEFAULT_ITEMS as unknown as T[];
  }, [items]);

  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  useEffect(() => {
    setSelectedIndex(initialSelectedIndex);
  }, [initialSelectedIndex, resolvedItems.length]);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  };

  useEffect(() => {
    if (!enableArrowNavigation || resolvedItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, resolvedItems.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < resolvedItems.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(resolvedItems[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resolvedItems, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;

    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;

    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;

      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }

    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={cn('relative', containerWidthClass, className)}>
      <div
        ref={listRef}
        className={cn(
          'p-4',
          scrollable ? maxHeightClass : undefined,
          scrollable ? 'overflow-y-auto' : undefined,
          scrollable && displayScrollbar
            ? '[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-[#060010] [&::-webkit-scrollbar-thumb]:bg-[#222] [&::-webkit-scrollbar-thumb]:rounded-[4px]'
            : undefined,
          scrollable && !displayScrollbar ? 'scrollbar-hide' : undefined
        )}
        onScroll={scrollable ? handleScroll : undefined}
        style={
          scrollable
            ? {
                scrollbarWidth: displayScrollbar ? 'thin' : 'none',
                scrollbarColor: '#222 #060010',
              }
            : undefined
        }
      >
        {resolvedItems.map((item, index) => {
          const isSelected = selectedIndex === index;
          const key = getItemKey ? getItemKey(item, index) : index;

          const defaultItem = (
            <div className={cn('rounded-lg bg-[#111] p-4', isSelected ? 'bg-[#222]' : undefined, itemClassName)}>
              <p className="m-0 text-white">{String(item)}</p>
            </div>
          );

          return (
            <AnimatedItem
              key={key}
              delay={index * staggerDelay}
              index={index}
              onMouseEnter={onItemSelect ? () => handleItemMouseEnter(index) : undefined}
              onClick={onItemSelect ? () => handleItemClick(item, index) : undefined}
              animation={animation}
            >
              {renderItem ? renderItem(item, index, isSelected) : defaultItem}
            </AnimatedItem>
          );
        })}
      </div>

      {showGradients && scrollable ? (
        <>
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-[#060010] to-transparent transition-opacity duration-300 ease"
            style={{ opacity: topGradientOpacity }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#060010] to-transparent transition-opacity duration-300 ease"
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      ) : null}
    </div>
  );
};

export default AnimatedList;
