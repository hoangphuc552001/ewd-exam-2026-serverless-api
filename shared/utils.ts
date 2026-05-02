import { marshall } from "@aws-sdk/util-dynamodb";
import { DBCinema, DBMovie, DBSchedule } from "./types";
import { movies, cinemas, schedule} from '../seed/data'


type Item = DBCinema | DBMovie | DBSchedule ; 

export const generateItem = (item: Item) => {
  return {
    PutRequest: {
      Item: marshall(item),
    },
  };
};

export const generateBatch = (data: Item[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};

export const generateSeedData = () => {
  const cis: any[] = generateBatch(cinemas)
  const mos: any[] = generateBatch(movies)
  const scs: any[] = generateBatch(schedule)

  return [...cis, ...mos, ...scs ]
};
