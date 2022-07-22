import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderComponent } from './slider.component';
import { SliderItemDirective } from "./slider-item.directive";


@NgModule({
  declarations: [
    SliderComponent,
    SliderItemDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [SliderComponent, SliderItemDirective]
})
export class SliderModule { }
