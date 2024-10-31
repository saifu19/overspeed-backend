import User from '#models/user';
import { registerValidator } from '#validators/auth';
import type { HttpContext } from '@adonisjs/core/http';

class RegisterService {
  

  async registerUser({ request, auth }: HttpContext) {
    // Validate data using the validator
    const data = await request.validateUsing(registerValidator);

    // Create the new user in the database
    const user = await User.create(data);

    // Log the user in
    await auth.use('web').login(user);

    return user;
  }
}

export default new RegisterService();
