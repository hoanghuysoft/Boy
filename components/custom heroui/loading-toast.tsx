import Ionicons from '@react-native-vector-icons/ionicons/static';
import { cn } from 'heroui-native/utils';
import { useThemeColor } from 'heroui-native/hooks';
import { Spinner } from 'heroui-native/spinner';
import { Toast, type ToastComponentProps } from 'heroui-native/toast';
import { useEffect } from 'react';
import { View } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { useSharedState } from './use-shared-state';

const StyledIonicons = withUniwind(Ionicons);

const LOADING_STATE_KEY = 'loading-toast-state';

/**
 * Hook to access and update shared loading state
 * Can be used in both parent component and toast component
 *
 * When setIsLoading is called, all components using this hook will re-render
 * with the new loading state, even if they're memoized or rendered separately
 */
export const useLoadingState = () => {
  const { state: isLoading, setState: setIsLoading } = useSharedState<boolean>(
    LOADING_STATE_KEY,
    false
  );

  return { isLoading, setIsLoading };
};

export interface LoadingToastProps extends ToastComponentProps {
  loadingText?: string;
  successText?: string;
}

/**
 * Loading toast component that shows "Loading..." initially
 * and switches to "Loaded successfully" after loading completes
 * Uses shared loading state from useLoadingState hook
 */
export const LoadingToast = (props: LoadingToastProps) => {
  const { id, hide, loadingText = 'Loading...', successText = 'Loaded successfully' } = props;
  const { isLoading } = useLoadingState();

  const themeColorMuted = useThemeColor('muted');

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        hide(id);
      }, 750);
    }
  }, [isLoading, hide, id]);

  return (
    <Toast
      // @ts-ignore
      layout={LinearTransition.springify().mass(2)}
      className={cn(
        'self-center flex-row gap-3 rounded-full p-2 px-4'
      )}
      isSwipeable={false}
      {...props}
    >
      <View className="flex-row items-center gap-2">
        <View
          className={cn(
            'size-7 items-center justify-center rounded-full',
            isLoading ? 'bg-muted/10' : 'bg-success/10'
          )}
        >
          {isLoading ? (
            <Spinner size="sm" color={themeColorMuted} />
          ) : (
            <StyledIonicons name="checkmark" size={18} className="text-success" />
          )}
        </View>
        <Toast.Title
          className={cn(
            'text-sm',
            isLoading ? 'text-muted/75' : 'text-success'
          )}
          maxFontSizeMultiplier={1}
        >
          {isLoading ? loadingText : successText}
        </Toast.Title>
      </View>
    </Toast>
  );
};
