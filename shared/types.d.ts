
export type SignUpBody = {
    username: string;
    password: string;
    email: string
  }

  export type ConfirmSignUpBody = {
    username: string;
    code: string;
  }

  export type SignInBody = {
    username: string;
    password: string;
  }
  
  // ====================================
  
  export type  Movie = {
    id: string;
    name : string;
    overview: string;
    duration: number   // player names
  }

  export type DBMovie = Omit<Movie, "id"> & {
    pk: `m#${Movie['id']}`;  
    sk: `m#${Movie['id']}`; 
  }
  
  export type  Cinema = {
    id: string;
    city : string;
  }

  export type DBCinema = Omit<Cinema, "id"> & {
    pk: `c#${Cinema['id']}`;  
    sk: `c#${Cinema['id']}`; 
  }
  
  export type  Schedule = {
    cinemaId: Cinema['id']
    movieId: Movie['id'];
    screenNo : string;
  }

  export type DBSchedule = Omit<Schedule, 'movieId' | 'cinemaId'> & {
    pk: `s#${Cinema['id']}`;  
    sk: `s#${Movie['id']}`; 
  }