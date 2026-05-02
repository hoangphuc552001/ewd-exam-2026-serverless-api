import { DBCinema, DBMovie, DBSchedule } from "../shared/types";

export const movies: DBMovie[] = [
  {
    pk: "m#1",
    sk: "m#1",
    name: "Movie 1",
    overview: "Overview of movie 1",
    duration: 120,
  },
  {
    pk: "m#2",
    sk: "m#2",
    name: "Movie 2",
    overview: "Overview of movie 2",
    duration: 122,
  },
  {
    pk: "m#3",
    sk: "m#3",
    name: "Movie 3",
    overview: "Overview of movie 3",
    duration: 123,
  },
  {
    pk: "m#4",
    sk: "m#4",
    name: "Movie 4",
    overview: "Overview of movie 4",
    duration: 124,
  },
];

export const cinemas: DBCinema[] = [
  {
    pk: "c#1001",
    sk: "c#1001",
    city: "Waterford",
  },
  {
    pk: "c#1002",
    sk: "c#1002",
    city: "Kilkenny",
  },
  {
    pk: "c#1003",
    sk: "c#1003",
    city: "Dublin",
  },
];

export const schedule: DBSchedule[] = [
  {
    pk: "s#1001",
    sk: "s#1",
    screenNo: 's1',
  },
  {
    pk: "s#1001",
    sk: "s#2",
    screenNo: 's2',
  },
  {
    pk: "s#1002",
    sk: "s#1",
    screenNo: 's1',
  },
];
