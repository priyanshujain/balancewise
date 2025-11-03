import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';

interface PagerViewProps {
  style?: ViewStyle;
  initialPage?: number;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
  children: React.ReactNode;
}

export interface PagerViewRef {
  setPage: (page: number) => void;
}

const PagerView = forwardRef<PagerViewRef, PagerViewProps>(
  ({ style, initialPage = 0, onPageSelected, children }, ref) => {
    const [currentPage, setCurrentPage] = useState(initialPage);

    useImperativeHandle(ref, () => ({
      setPage: (page: number) => {
        setCurrentPage(page);
      },
    }));

    useEffect(() => {
      if (onPageSelected) {
        onPageSelected({ nativeEvent: { position: currentPage } });
      }
    }, [currentPage, onPageSelected]);

    const childArray = React.Children.toArray(children);

    return (
      <View style={style}>
        {childArray.map((child, index) => (
          <View
            key={index}
            style={{
              display: index === currentPage ? 'flex' : 'none',
              flex: 1,
            }}
          >
            {child}
          </View>
        ))}
      </View>
    );
  }
);

PagerView.displayName = 'PagerView';

export default PagerView;
