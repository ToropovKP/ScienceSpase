import {Author} from "../../author/model/author";
import {FileMetadata} from "../../common/model/file.metadata";
import {Review} from "./review";

export interface Job {
  id: bigint;
  title: string;
  description: string;
  coAuthors: Author[];
  userName: string;
  conferenceTitle: string;
  sectionTitle: string;
  userId: bigint;
  conferenceId: bigint;
  sectionId: bigint;
  files: FileMetadata[];
  reviews: Review[];
  dateTime: Date;
}
