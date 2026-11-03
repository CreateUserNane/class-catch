import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { TeacherDashboard } from './pages/teacher-dashboard/teacher-dashboard';
import { StudentDashboard } from './pages/student-dashboard/student-dashboard';
import { TeacherClass } from './pages/teacher-class/teacher-class';
import { StudentClass } from './pages/student-class/student-class';
import { LessonPage } from './pages/lesson-page/lesson-page';
import { AuthGuard } from './guards/auth.guard';
import { AnyAuthenticatedGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'dashboard/teacher',
    component: TeacherDashboard,
    canActivate: [AuthGuard('teacher')],
  },
  {
    path: 'dashboard/student',
    component: StudentDashboard,
    canActivate: [AuthGuard('student')],
  },
  {
    path: 'classes/:id',
    component: TeacherClass,
    canActivate: [AuthGuard('teacher')],
  },
  {
    path: 'student/classes/:id',
    component: StudentClass,
    canActivate: [AuthGuard('student')],
  },
  {
    path: 'lessons/:id',
    component: LessonPage,
    canActivate: [AnyAuthenticatedGuard],
  },
];
