import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  PanResponder,
  Text,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  height = 400,
  onDragStart,
  onDragEnd,
}) => {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 40);
  const [ratio, setRatio] = useState(0.5);
  const [isSliding, setIsSliding] = useState(false);
  
  // Use refs for value persistence across renders
  const currentRatio = useRef(0.5);
  const startRatio = useRef(0.5);
  
  const panResponder = useRef(
    PanResponder.create({
      // We take control as soon as any move is detected
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, // Aggressive capture
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: () => {
        setIsSliding(true);
        startRatio.current = currentRatio.current;
        onDragStart?.();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (containerWidth <= 0) return;
        
        // Use relative movement for maximum stability
        const delta = gestureState.dx / containerWidth;
        let nextRatio = startRatio.current + delta;
        
        // Clamp and update
        nextRatio = Math.max(0, Math.min(1, nextRatio));
        currentRatio.current = nextRatio;
        setRatio(nextRatio);
      },
      
      onPanResponderRelease: () => {
        setIsSliding(false);
        onDragEnd?.();
      },
      onPanResponderTerminate: () => {
        setIsSliding(false);
        onDragEnd?.();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View 
      style={[
        styles.container, 
        { height },
        // @ts-ignore
        { cursor: isSliding ? 'grabbing' : 'ew-resize', userSelect: 'none', touchAction: 'none' }
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
      {...panResponder.panHandlers}
    >
      {/* Background (Before Image) */}
      <View style={styles.imageWrapper} pointerEvents="none">
        <Image 
            {...({
              source: { uri: beforeImage },
              style: [styles.image, { width: containerWidth, height }],
              draggable: false,
            } as any)}
        />
        <View style={styles.labelContainer}>
            <View style={styles.label}>
                <Text style={styles.labelText}>ÖNCESİ</Text>
            </View>
        </View>
      </View>

      {/* Masked Foreground (After Image) */}
      <View 
        style={[styles.afterWrapper, { width: `${ratio * 100}%`, height }]} 
        pointerEvents="none"
      >
        <Image 
            {...({
              source: { uri: afterImage },
              style: [styles.image, { width: containerWidth, height }],
              draggable: false,
            } as any)}
        />
        <View style={[styles.labelContainer, { alignItems: 'flex-start', paddingLeft: 10 }]}>
            <View style={[styles.label, { backgroundColor: '#6366f1' }]}>
                <Text style={styles.labelText}>SONRASI</Text>
            </View>
        </View>
      </View>

      {/* Handle */}
      <View
        pointerEvents="none"
        style={[
          styles.handle,
          { left: `${ratio * 100}%` },
        ]}
      >
        <View style={[styles.handleLine, isSliding && styles.activeHandleLine]} />
        <View style={[styles.handleCircle, isSliding && styles.activeHandleCircle]}>
          <ChevronLeft size={16} color="#475569" />
          <ChevronRight size={16} color="#475569" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  afterWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    zIndex: 1,
    borderRightWidth: 2,
    borderRightColor: '#fff',
  },
  image: {
    resizeMode: 'cover',
  },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -1,
  },
  handleLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
  },
  activeHandleLine: {
    width: 4,
    backgroundColor: '#fff',
  },
  handleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  activeHandleCircle: {
    transform: [{ scale: 1.2 }],
    backgroundColor: '#f8fafc',
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  label: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  labelText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  }
});

export default BeforeAfterSlider;
