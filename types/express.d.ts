import { User } from "../entity/user.entity";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
