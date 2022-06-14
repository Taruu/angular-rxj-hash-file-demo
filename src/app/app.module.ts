import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DxButtonModule, DxFileUploaderModule, DxListModule, DxProgressBarModule } from 'devextreme-angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SideNavInnerToolbarModule, SideNavOuterToolbarModule, SingleCardModule } from './layouts';
import { FilesHashComponent } from './pages/files-hash/files-hash.component';
import { ChangePasswordFormModule, CreateAccountFormModule, FooterModule, LoginFormModule, ResetPasswordFormModule } from './shared/components';
import { AppInfoService, AuthService, ScreenService } from './shared/services';
import { HashFileService } from './shared/services/hash-file.service';
import { UnauthenticatedContentModule } from './unauthenticated-content';
@NgModule({
  declarations: [
    AppComponent,
    FilesHashComponent,
  ],
  imports:
    [
      DxListModule,
      DxProgressBarModule,
      DxFileUploaderModule,
      DxButtonModule,
      BrowserModule,
      SideNavOuterToolbarModule,
      SideNavInnerToolbarModule,
      SingleCardModule,
      FooterModule,
      ResetPasswordFormModule,
      CreateAccountFormModule,
      ChangePasswordFormModule,
      LoginFormModule,
      UnauthenticatedContentModule,
      AppRoutingModule
    ],
  providers: [
    AuthService,
    ScreenService,
    AppInfoService,
    HashFileService

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
