
export interface CreateVideoRoomRequest {
  lessonId: string;
  userRole: 'tutor' | 'student';
}

export interface GetTokensRequest {
  lessonId: string;
  userRole: 'tutor' | 'student';
}

export interface RegenerateTokensRequest {
  lessonId: string;
  userRole: 'tutor' | 'student';
}
