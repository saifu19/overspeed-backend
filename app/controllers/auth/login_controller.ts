import User from '#models/user'
import { loginValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoginController {
  
  async show({view}: HttpContext) {
    
    return view.render('pages/auth/login')



  }
  
  async store({request,response,auth,session}: HttpContext) {

    try {
      const { email, password } = await request.validateUsing(loginValidator);
      // console.log("Validation passed", { email, password });
  
      const user = await User.verifyCredentials(email, password);
      await auth.use('web').login(user);
  
      return response.redirect().toPath('/');
    } catch (error) {
      console.error("Error occurred", error.messages);
      // Flash the error message to the session
      session.flash({ error: 'Invalid login credentials, please try again.' });

      // session.flash({
      //   notification:{
      //     type:'danger',
      //     message:'Invalid Credentials'
      //   }
      // })

      // Redirect back to the login page with flashed data
      return response.redirect().back();  // Send validation or other errors back to the client
    }


  }
  
}