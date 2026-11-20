import Ionicons from '@react-native-vector-icons/ionicons/static';
import { cn } from 'heroui-native/utils';
import { useThemeColor } from 'heroui-native/hooks';
import { Spinner } from 'heroui-native/spinner';
import { Toast, type ToastComponentProps } from 'heroui-native/toast';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { useSharedState } from './use-shared-state';

const StyledIonicons = withUniwind(Ionicons);

const LOADING_STATE_KEY = 'loading-toast-state';
export type LoadingToastStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Hook to access and update shared loading state
 * Can be used in both parent component and toast component
 *
 * Uses a tri-state status ('idle' | 'loading' | 'success' | 'error') so that
 * failed or cancelled operations never flash the green "Post created successfully!" state.
 */
export const useLoadingState = () => {
  const { state: status, setState: setLoadingStatus } = useSharedState<LoadingToastStatus>(
    LOADING_STATE_KEY,
    'idle'
  );

  const isLoading = status === 'loading';

  const setIsLoading = useCallback(
    (loading: boolean) => {
      setLoadingStatus(loading ? 'loading' : 'success');
    },
    [setLoadingStatus]
  );

  return { isLoading, status, setIsLoading, setLoadingStatus };
};

export interface LoadingToastProps extends ToastComponentProps {
  loadingText?: string;
  successText?: string;
}

/**
 * Loading toast component that shows "Loading..." initially
 * and switches to "Loaded successfully" only when status transitions to 'success'.
 */
export const LoadingToast = (props: LoadingToastProps) => {
  const { id, hide, loadingText = 'Loading...', successText = 'Loaded successfully' } = props;
  const { status } = useLoadingState();
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  const themeColorMuted = useThemeColor('muted');

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        hide(id);
      }, 750);
      return () => clearTimeout(timer);
    }
    if (status === 'error' || status === 'idle') {
      hide(id);
    }
    return undefined;
  }, [status, hide, id]);

  if (status === 'error' || status === 'idle') {
    return null;
  }

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
          ) : isSuccess ? (
            <StyledIonicons name="checkmark" size={18} className="text-success" />
          ) : null}
        </View>
        <Toast.Title
          className={cn(
            'text-sm',
            isLoading ? 'text-muted/75' : 'text-success'
          )}
          maxFontSizeMultiplier={1}
        >
          {isLoading ? loadingText : isSuccess ? successText : ''}
        </Toast.Title>
      </View>
    </Toast>
  );
};
