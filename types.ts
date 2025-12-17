// src/types.ts

// 定义用户角色 (必须匹配 App.tsx 里的 UserRole.ADMIN)
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

// 定义用户结构
export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  password?: string;
  phoneNumber?: string;
  idCardNumber?: string;
  birthday?: string;
}

// 定义照片分类
export type PhotoCategory = 'scenery' | 'food' | 'group' | 'portrait' | 'activity';

// 定义评论结构
export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

// 定义照片结构
export interface Photo {
  id: string;
  tourId: string;
  uploadedBy: string; // User ID
  ownerId: string;    // User ID (attributed owner)
  url: string;
  caption: string;
  date: string;
  location: string;
  category: PhotoCategory;
  tags: string[];     // User IDs of tagged people
  likes: number;
  isShared: boolean;
  comments: Comment[];
}

// 定义行程结构
export interface Tour {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  duration: string;
  coverImage: string;
  description: string;
  cities: string[];
  allowedUserIds: string[]; // 只有名单里的人能看
  adminNotes?: string;      // 管理员备注
  itinerary?: Record<string, string>; // 日期对应的描述 { "2023-10-01": "Day 1: Arrive" }
}