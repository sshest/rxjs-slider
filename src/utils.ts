import {pipe, tap} from "rxjs";

export const preventEventPropagation = pipe(
  tap((e: any) => {
    e.preventDefault();
    e.stopPropagation();
  })
);
