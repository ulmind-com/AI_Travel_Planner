export interface PostAuthor {
  _id?: string;
  firebaseUid?: string;
  username?: string;
  fullname?: string;
  profilepicture?: string;
}

export interface CommunityPost {
  _id: string;
  firebaseUid?: string;
  userId?: PostAuthor | string;
  title?: string;
  content: string;
  category?: string;
  images?: string[];
  tags?: string[];
  destinationTags?: string[];
  likes?: string[];
  repliesCount?: number;
  viewCount?: number;
  tripId?: any;
  createdAt?: string;
}

export interface Comment {
  _id: string;
  firebaseUid?: string;
  userId?: PostAuthor | string;
  content: string;
  likes?: string[];
  createdAt?: string;
}

export interface CommunityEvent {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  image?: string;
  attendees?: string[];
}

export interface Story {
  _id: string;
  firebaseUid?: string;
  userId?: PostAuthor | string;
  image?: string;
  mediaUrl?: string;
  caption?: string;
  likes?: string[];
  createdAt?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  coverImage?: string;
  membersCount?: number;
  members?: any[];
  category?: string;
}
