import {AfterContentInit, Component, ContentChildren, ElementRef, OnDestroy, OnInit, QueryList} from '@angular/core';
import {SliderItemDirective} from "./slider-item.directive";
import {
  animationFrameScheduler,
  filter,
  fromEvent,
  map,
  merge,
  NEVER, observeOn,
  of,
  repeat,
  repeatWhen,
  retryWhen,
  share,
  Subject, switchMap, take, takeLast,
  takeUntil,
  tap,
  timer
} from "rxjs";
import {preventEventPropagation} from "../../utils";

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit, AfterContentInit, OnDestroy {
  @ContentChildren(SliderItemDirective) sliderItems!: QueryList<SliderItemDirective>
  private readonly DELTA_DIRECTION_COEFFICIENT = -1;
  private readonly  MOVE_THRESHOLD = 0.15;
  private moveThreshold = 0;
  private gotoPrevPage = 0;
  private gotoNextPage = 0;
  private destroyed$ = new Subject<void>();

  public active = 1;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    const clientWidth = this.el.nativeElement.firstChild.clientWidth;
    this.moveThreshold = clientWidth * this.MOVE_THRESHOLD;
    this.gotoPrevPage = -1 * this.moveThreshold - 1;
    this.gotoNextPage = this.moveThreshold + 1;
  }

  ngAfterContentInit() {
    const nativeEl = this.el.nativeElement;
    const items = this.sliderItems.toArray();
    const touchStart$ = merge(
      fromEvent(nativeEl, 'touchstart').pipe(
        map((e: any) => e.touches[0])
      ),
      fromEvent(nativeEl, 'mousedown')
    ).pipe(
      tap(console.log),
      preventEventPropagation,
      tap(e => {
        this.sliderItems.forEach(item => {
          this.animateSliderItem(item, null, 0)
        })
      })
    );

    const touchEnd$ = merge(
      fromEvent(nativeEl, 'touchend'),
      fromEvent(nativeEl, 'mouseup')
    )

    const touchMove$ = (startEvent: any) => merge(
      fromEvent(nativeEl, 'touchmove')
        .pipe(
          map((e: any) => e.touches[0])
        ),
      fromEvent(nativeEl, 'mousemove')
    ).pipe(
      preventEventPropagation,
      observeOn(animationFrameScheduler),
      takeUntil(touchEnd$),
      map(ev => startEvent.pageX - ev.pageX),
      tap(data => {
        items.forEach(item => {
          const delta = this.DELTA_DIRECTION_COEFFICIENT *
            ((this.active - 1) *
              this.el.nativeElement.firstChild.clientWidth) - data;
          this.animateSliderItem(item, delta, null);
        });
      }),
      takeLast(1)
    );

    const swipe$ = touchStart$.pipe(
      switchMap(startEvent => touchMove$(startEvent))
    );

    const leftArrow$ = fromEvent(document, 'keydown').pipe(
      map((event: Event) => <KeyboardEvent>event),
      filter((e: KeyboardEvent) => e.code === 'KeyA'),
      map(() => this.gotoPrevPage)
    )

    const rightArrow$ = fromEvent(document, 'keydown').pipe(
      map((event: Event) => <KeyboardEvent>event),
      filter((e: KeyboardEvent) => e.code === 'KeyD'),
      map(() => this.gotoNextPage)
    )

    const events$ = merge(
      swipe$,
      leftArrow$,
      rightArrow$
    ).pipe(share())

    const timer$ = timer(5000).pipe(
      takeUntil(events$),
      repeat(),
      tap(() => {
        if (this.active >= items.length) {
          this.active = 0;
          items.forEach(item => {
            this.animateSliderItem(item, 0, 300);
          })
        }
      }),
      map(() => this.gotoNextPage)
    )

    // merge events and subscribe on them
    merge(events$, timer$).pipe(
      tap((val) => {
        let shouldSwitchSlides = false;
        if (val > this.moveThreshold) {
          if (this.active < items.length) {
            this.active++;
          } else {
            this.active = 1;
            shouldSwitchSlides = true;
          }
        } else if (val < -1 * this.moveThreshold) {
          if (this.active > 1) {
            this.active--;
          } else {
            this.active = items.length;
          }
        }

        items.forEach((item) => {
          const delta = shouldSwitchSlides ? 0 : this.DELTA_DIRECTION_COEFFICIENT * ((this.active - 1) * this.el.nativeElement.firstChild.clientWidth);
          this.animateSliderItem(item, delta, 300);
        })
      }),
      takeUntil(this.destroyed$)
    ).subscribe();
  }

  private animateSliderItem(
    item: SliderItemDirective,
    delta?: number | null,
    transitionTime?: number | null
  ) {
    if (!!transitionTime) {
      item.setTransition(transitionTime);
    }
    if (!!delta || delta === 0) {
      item.setStyle('transform', `translateX(${delta}px)`);
    }
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

}
