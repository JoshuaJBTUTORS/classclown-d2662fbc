
// Global type declarations for Agora Flexible Classroom CDN
declare global {
  interface Window {
    FcrUIScene: {
      launch: (
        container: HTMLElement,
        options: {
          appId: string;
          region: string;
          userUuid: string;
          userName: string;
          roomUuid: string;
          roomType: number;
          roomName: string;
          pretest: boolean;
          token: string;
          language: string;
          duration: number;
          recordUrl: string;
          roleType: number;
          widgets?: {
            easemobIM?: any;
            netlessBoard?: any;
            poll?: any;
            mediaPlayer?: any;
            webView?: any;
            countdownTimer?: any;
            popupQuiz?: any;
          };
          virtualBackgroundImages?: Record<string, string>;
          virtualBackgroundVideos?: string[];
        },
        onSuccess?: () => void,
        onError?: (error: any) => void,
        onDestroy?: (type: any) => void
      ) => () => void;
    };
    FcrChatroom: any;
    FcrBoardWidget: any;
    FcrPollingWidget: any;
    FcrStreamMediaPlayerWidget: any;
    FcrWebviewWidget: any;
    FcrCountdownWidget: any;
    FcrPopupQuizWidget: any;
  }
}

// Global variables from CDN
declare const FcrUIScene: Window['FcrUIScene'];
declare const FcrChatroom: any;
declare const FcrBoardWidget: any;
declare const FcrPollingWidget: any;
declare const FcrStreamMediaPlayerWidget: any;
declare const FcrWebviewWidget: any;
declare const FcrCountdownWidget: any;
declare const FcrPopupQuizWidget: any;

export {};
