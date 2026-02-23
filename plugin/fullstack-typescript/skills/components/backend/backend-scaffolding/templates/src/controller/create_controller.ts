// Controller: Assembles routers and creates Dependencies for Model
import type { Router } from 'express';
import { Router as createRouter } from 'express';

export type ControllerDependencies = {
  // Add DAL dependencies here as features are implemented
  // Example:
  // readonly dal: {
  //   readonly findUserById: Dependencies['findUserById'];
  // };
};

export type Controller = {
  readonly router: Router;
};

export const createController = (_deps: ControllerDependencies): Controller => {
  const router = createRouter();

  // Mount feature routers here
  // Example:
  // const usersRouter = createUsersRouter({ modelDeps });
  // router.use('/users', usersRouter);

  return { router };
};
