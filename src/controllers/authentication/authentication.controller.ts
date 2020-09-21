import { Request, Response, NextFunction, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import UserModel from "../user/user.model";
import AuthenticationService from "./authentication.service";
import UserDTO from "../user/user.dto";
import validate from "../../middleware/validation.middleware";

import axios from "axios";

class AuthenticationController implements Controller {
  public path = "/auth";
  public router = Router();
  public authenticationService = new AuthenticationService();
  private user = UserModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.getCookies);
    this.router.post(
      `${this.path}/login`,
      validate(UserDTO),
      this.login,
      this.save
    );
  }

  private getCookies = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.cookie) {
      const refreshToken = req.headers.cookie.replace("refreshToken=", "");
      axios
        .post(
          `https://kauth.kakao.com/oauth/token?grant_type=refresh_token&client_id=${process.env.CLIENT_ID}&refresh_token=${refreshToken}&client_secret=${process.env.CLIENT_SECRET}`
        )
        .then(({ data }) => {
          res.json({ status: true, token: data.access_token}).end();
        })
        .catch((err) => {
          res.json({ status: false }).end();
        });
    } else {
      res.json({ status: false }).end();
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try{
      const { userId, refreshToken, tokenExp, profileImage, thumbnailImage }: UserDTO = req.body;
      const userInfo = await this.user.findOne({ userId: userId });
      if(userInfo) {
        if(userInfo.profileImage !== profileImage) {
          this.user.updateOne({ userId: userId }, { $set : { profileImage: profileImage, thumbnailImage: thumbnailImage} });
        }
        res.cookie("refreshToken", refreshToken, {
          maxAge: tokenExp,
        });
        res.json(true).end();
      } else {
        next();
      }
    } catch(e) {
      next(e);
    }
  };

  private save = (req: Request, res: Response, next: NextFunction) => {
    const saveUserData: UserDTO = req.body;
    const userSchema = new this.user(saveUserData);
    userSchema
      .save()
      .then((result: any) => {
        res.cookie("refreshToken", saveUserData.refreshToken, {
          maxAge: saveUserData.tokenExp,
        });
        res.json(false);
      })
      .catch((err: Error) => next(err));
  };
}

export default AuthenticationController;
