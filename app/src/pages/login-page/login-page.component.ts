import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {CommonModule, NgOptimizedImage } from "@angular/common";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatSelectModule} from "@angular/material/select";
import {AuthService} from "../../services/AuthService";
import {OrganizationService} from "../../services/OrganizationService";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Organization} from "../../models/Organization";
import {Patroller} from "../../models/Patroller";

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    NgOptimizedImage
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements OnInit {
  loginForm: FormGroup;
  organizationVerified: Organization | null = null
  fastAuth = false;
  patrollers: Patroller[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private organizationService: OrganizationService,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      organizationId: ['', Validators.required],
      patrollerIdentifier: ['', Validators.required],
      pin: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (this.authService.getOrganization()) {
        this.loginForm.patchValue({organizationId: this.authService.getOrganization()?.id});
        this.onOrganizationIdBlur();
      }else if (params['organizationId'] && params['organizationId'] !== 'login') {
        this.loginForm.patchValue({ organizationId: params['organizationId'] });
        this.onOrganizationIdBlur();
      }
    });

  }

  onOrganizationIdBlur() {
    const organizationId = this.loginForm.get('organizationId')?.value;
    if (organizationId) {
      this.organizationService.verifyOrganization(organizationId).subscribe({
          next: (response) => {
            if (response.organization === null) {
              this.snackBar.open('Organisation not found', 'Close', {duration: 5000});
              this.organizationVerified = null;
              return;
            }

            this.authService.setOrganization(response.organization);

            this.organizationVerified = response.organization;
            this.fastAuth = response.fastAuth;
            if (this.fastAuth && response.patrollers) {
              this.patrollers = response.patrollers;
            }
            if (!this.fastAuth) {
              this.loginForm.get('patrollerIdentifier')?.reset();
            }
          },
          error: () => {
            this.organizationVerified = null;
            this.fastAuth = false;
            this.patrollers = [];
            this.snackBar.open('Organisation not found', 'Close', {duration: 5000});
          }
        });
    }
  }

  onSubmit() {
    if (this.loginForm.valid && this.organizationVerified) {
      const { organizationId, patrollerIdentifier, pin } = this.loginForm.value;
      this.authService.guardLogin(organizationId, patrollerIdentifier, pin).subscribe({
        next: () => {
          this.authService.login(patrollerIdentifier);
          this.router.navigate(['/']);
        },
        error: (error) => {
          const message = error?.error?.message ?? 'Unable to sign in';
          this.snackBar.open(message, 'Close', {duration: 5000});
        }
      });
    }
  }
}
