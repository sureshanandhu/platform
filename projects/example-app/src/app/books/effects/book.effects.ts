import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { asyncScheduler, EMPTY as empty, Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  skip,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import { GoogleBooksService } from '@example-app/core/services/google-books.service';
import { BooksApiActions, FindBookPageActions } from '@example-app/books/actions';
import { Book } from '@example-app/books/models/book';

/**
 * Effects offer a way to isolate and easily test side-effects within your
 * application.
 *
 * If you are unfamiliar with the operators being used in these examples, please
 * check out the sources below:
 *
 * Official Docs: http://reactivex.io/rxjs/manual/overview.html#categories-of-operators
 * RxJS 5 Operators By Example: https://gist.github.com/btroncone/d6cf141d6f2c00dc6b35
 */

@Injectable()
export class BookEffects {
  @Effect()
  search$ = ({ debounce = 300, scheduler = asyncScheduler } = {}): Observable<
    Action
  > =>
    this.actions$.pipe(
      ofType<FindBookPageActions.SearchBooks>(
        FindBookPageActions.FindBookPageActionTypes.SearchBooks
      ),
      debounceTime(debounce, scheduler),
      map(action => action.payload),
      switchMap(query => {
        if (query === '') {
          return empty;
        }

        const nextSearch$ = this.actions$.pipe(
          ofType(FindBookPageActions.FindBookPageActionTypes.SearchBooks),
          skip(1)
        );

        return this.googleBooks.searchBooks(query).pipe(
          takeUntil(nextSearch$),
          map((books: Book[]) => new BooksApiActions.SearchSuccess(books)),
          catchError(err => of(new BooksApiActions.SearchFailure(err)))
        );
      })
    );

  constructor(
    private actions$: Actions,
    private googleBooks: GoogleBooksService
  ) {}
}
