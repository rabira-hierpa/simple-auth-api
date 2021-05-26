var config = require("../../server/config.json");
var senderAddress = "noreply@loopback.com";
const env = require("dotenv").config();

if (env.error) {
  throw env.error;
}

module.exports = function (Student) {
  //send verification email after registration
  Student.afterRemote("login", async (ctx, result) => {
    if (!ctx.req.body) {
      throw error("Internal server error", 500);
    }
    ctx.result = {
      auth_token: result.id,
      email: ctx.req.body.email,
      role: "student",
      id: result.userId,
    };
  });

  Student.afterRemote("create", function (context, user, next) {
    var options = {
      type: "email",
      to: user.email,
      from: senderAddress,
      subject: "Thanks for registering!.",
      redirect: env.EMAIL_VER_URL + user.id,
      user: user,
    };
    user.verify(options, function (err, response) {
      if (err) {
        Student.deleteById(user.id);
        return next(err);
      }
      context.res.json({
        title: "Signed up successfully",
        content:
          "Please check your email and click on the verification link " +
          "before logging in.",
        redirectTo: env.EMAIL_VER_URL,
        redirectToLinkText: "Log in",
      });
    });
  });

  // Method to render
  Student.afterRemote("prototype.verify", function (context, user, next) {
    context.res.json({
      title:
        "A Link to reverify your identity has been sent " +
        "to your email successfully",
      content:
        "Please check your email and click on the verification link " +
        "before logging in",
      redirectTo: "/",
      redirectToLinkText: "Log in",
    });
  });
  //send password reset link when requested
  Student.on("resetPasswordRequest", function (info) {
    let url =
    env.PASSWORD_RESET_URL +   
    info.accessToken.userId;
    var html =
      'Click <a href="' +
      url +
      "?access_token=" +
      info.accessToken.id +
      '">here</a> to reset your password';
    console.log(info.accessToken);
    Student.app.models.Email.send(
      {
        to: info.email,
        from: senderAddress,
        subject: "Password reset",
        html: html,
      },
      function (err) {
        if (err) return console.log("> error sending password reset email");
        console.log("> sending password reset email to:", info.email);
      }
    );
  });

  //render UI page after password change
  Student.afterRemote("changePassword", function (context, user, next) {
    context.res.json({
      title: "Password changed successfully",
      content: "Please login again with new password",
      redirectTo: "/",
      redirectToLinkText: "Log in",
    });
  });

  //render UI page after password reset
  Student.afterRemote("setPassword", function (context, user, next) {
    context.res.json("response", {
      title: "Password reset success",
      content: "Your password has been reset successfully",
      redirectTo: "/",
      redirectToLinkText: "Log in",
    });
  });
};
