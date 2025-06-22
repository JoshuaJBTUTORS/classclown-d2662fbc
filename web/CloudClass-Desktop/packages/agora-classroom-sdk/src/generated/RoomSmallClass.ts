import {
  FcrEngagement,
  FcrExtension,
  FcrFooter,
  FcrHeader,
  FcrStage,
  FcrUIBaseProps,
  FcrUIConfig,
} from '@/infra/types/config';
import { loadUIConfig } from '@/infra/utils/config-loader';
import { EduRoomTypeEnum } from 'agora-edu-core';

export class FcrUIConfigImpl implements FcrUIConfig {
    get version(): string {
        return '1.0.0';
    }

    get name(): string {
        return 'All lessons';
    }


    get extension(): FcrExtension {
        return {
            get agoraChat() {
                return {
                    get muteAll(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get emoji(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get picture(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    enable: true,
                };
            },
        };
    }
    get engagement(): FcrEngagement {
        return {
            get roster() {
                return {
                    enable: true,
                };
            },
            get screenShare() {
                return {
                    enable: true,
                };
            },
            get raiseHand() {
                return {
                    enable: true,
                };
            },
            get popupQuiz() {
                return {
                    enable: true,
                };
            },
            get laserPointer() {
                return {
                    enable: true,
                };
            },
            get breakoutRoom() {
                return {
                    enable: true,
                };
            },
            get counter() {
                return {
                    enable: true,
                };
            },
            get poll() {
                return {
                    enable: true,
                };
            },
            get netlessBoard() {
                return {
                    get switch(): FcrUIBaseProps {
                        return {
                            enable: false,
                        };
                    },
                    get mouse(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get selector(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get pencil(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get text(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get eraser(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get clear(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get save(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get move(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    enable: true,
                };
            },
            get cloudStorage() {
                return {
                    enable: true,
                };
            },
        };
    }
    get stage(): FcrStage {
        return {
            get teacherVideo() {
                return {
                    get resetPosition(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get offStage(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    enable: true,
                };
            },
            get studentVideo() {
                return {
                    get camera(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get microphone(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get boardAuthorization(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get reward(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get offStage(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    enable: true,
                };
            },
        };
    }
    get header(): FcrHeader {
        return {
            get stateBar() {
                return {
                    get networkState(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get roomName(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get scheduleTime(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get classState(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get microphone(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    get camera(): FcrUIBaseProps {
                        return {
                            enable: true,
                        };
                    },
                    enable: true,
                };
            },
        };
    }
    get footer(): FcrFooter {
        return {
            enable: false,
        };
    }
}
loadUIConfig(EduRoomTypeEnum.RoomSmallClass, new FcrUIConfigImpl());

