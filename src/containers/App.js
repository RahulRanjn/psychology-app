import React, { Component } from "react";
// ***************** Quiz Features*****************
import quizQuestions from "../api/quizQuestions";
import InfoPage from "../components/Quiz/InfoPage/InfoPage";
import QuizPage from "./QuizPage";
// *****************smart-brain features*****************
import FaceRecognition from "../components/FaceRecognition/FaceRecognition";
import Navigation from "../components/Navigation/Navigation";
import Signin from "../components/Signin/Signin";
import Register from "../components/Register/Register";
import ImageLinkForm from "../components/ImageLinkForm/ImageLinkForm";
import Rank from "../components/Rank/Rank";
import { connect } from "react-redux";
import { setSearchField, requestRobots } from "../UserSearchPageExtras/actions";
import MainPage from "../components/UserSearchPage/MainPage";
import "./App.css";

// auth
import Profile from "../components/Profile/Profile";
import Modal from "../components/Modal/Modal";

const mapStateToProps = state => {
  return {
    searchField: state.searchRobots.searchField,
    robots: state.requestRobots.robots,
    isPending: state.requestRobots.isPending
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onSearchChange: event => dispatch(setSearchField(event.target.value)),
    onRequestRobots: () => dispatch(requestRobots())
  };
};

const initialState = {
  input: "",
  imageUrl: "",
  boxes: [],
  route: "signin",
  isProfileOpen: false,
  isSignedIn: false,
  counter: 0,
  user: {
    id: "",
    name: "",
    email: "",
    mbti: "",
    entries: 0,
    joined: "",
    age: 0,
    pet: ""
  }
};

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem("token");
    console.log("Looking for a token!");
    if (token) {
      console.log("Token Found && Refresh Page!!!");
      fetch("https://warm-woodland-74542.herokuapp.com/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.id) {
            fetch(
              `https://warm-woodland-74542.herokuapp.com/profile/${data.id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token
                }
              }
            )
              .then(response => response.json())
              .then(user => {
                if (user && user.email) {
                  this.loadUser(user);
                  this.onRouteChange("home");
                }
              });
          }
        })
        .catch(console.log);
    }
  }

  loadUser = data => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        mbti: data.mbti,
        entries: data.entries,
        joined: data.joined
      }
    });
  };
  calculateFaceLocation = data => {
    const image = document.getElementById("inputimage");
    const width = Number(image.width);
    const height = Number(image.height);
    return data.outputs[0].data.regions.map(face => {
      const clarifaiFace = face.region_info.bounding_box;
      return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - clarifaiFace.right_col * width,
        bottomRow: height - clarifaiFace.bottom_row * height
      };
    });
  };

  displayFaceBox = boxes => {
    this.setState({ boxes: boxes });
  };

  onInputChange = event => {
    this.setState({ input: event.target.value });
  };
  // update the entry number of the user each time an image is submitted
  onPictureSubmit = () => {
    this.setState({ imageUrl: this.state.input });
    fetch("https://warm-woodland-74542.herokuapp.com/imageurl", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: window.sessionStorage.getItem("token")
      },
      body: JSON.stringify({
        input: this.state.input
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response) {
          fetch("https://warm-woodland-74542.herokuapp.com/image", {
            method: "put",
            headers: {
              "Content-Type": "application/json",
              Authorization: window.sessionStorage.getItem("token")
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count }));
            })
            .catch(console.log);
        }
        this.displayFaceBox(this.calculateFaceLocation(response));
      })
      .catch(err => console.log(err));
  };

  onRouteChange = route => {
    if (route === "signout") {
      return this.setState(initialState);
    } else if (route === "home") {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route: route });
  };

  toggleModal = () => {
    this.setState(state => ({
      ...state,
      isProfileOpen: !state.isProfileOpen
    }));
  };
  signOut = () => {
    this.removeAuthTokenInSessions(this.token);
  };

  //----------------------------------------------------------
  //
  // saveAuthTokenInSessions = (token) => {
  //   window.sessionStorage.setItem('token', token);
  // }
  //  removeAuthTokenInSessions = (token) => {
  //    window.sessionStorage.removeItem('token');
  //  }

  // onSubmitSignIn = () => {
  //   fetch('https://warm-woodland-74542.herokuapp.com/signin', {
  //     method: 'post',
  //     headers: {'Content-Type': 'application/json'},
  //     body: JSON.stringify({
  //       email: this.state.signInEmail,
  //       password: this.state.signInPassword
  //     })
  //   })
  //     .then(response => response.json())
  //     .then(data => {
  //       if (data && data.success === "true") {
  //         this.saveAuthTokenInSessions(data.token)
  //         this.props.loadUser(data.user)
  //         this.props.onRouteChange('home');
  //       }
  //     })
  //     .catch(console.log)
  // }

  render() {
    const {
      isSignedIn,
      imageUrl,
      route,
      boxes,
      isProfileOpen,
      user
    } = this.state;
    return (
      <div className="App">
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
          toggleModal={this.toggleModal}
        />
        {isProfileOpen && (
          <Modal>
            <Profile
              removeAuthTokenInSessions={this.saveAuthTokenInSessions}
              onSubmitSignIn={this.onSubmitSignIn}
              isProfileOpen={isProfileOpen}
              signOut={this.signOut}
              toggleModal={this.toggleModal}
              user={user}
              loadUser={this.loadUser}
            />
          </Modal>
        )}
        {route === "home" ? (
          <div>
            <MainPage {...this.props} />
          </div>
        ) : route === "signin" ? (
          <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
        ) : route === "signout" ? (
          <Signin
            saveAuthTokenInSessions={this.saveAuthTokenInSessions}
            onSubmitSignIn={this.onSubmitSignIn}
            loadUser={this.loadUser}
            onRouteChange={this.onRouteChange}
          />
        ) : route === "quiz" ? (
          <div>
            <QuizPage onRouteChange={this.onRouteChange} />
          </div>
        ) : route === "info" ? (
          <InfoPage onRouteChange={this.onRouteChange} />
        ) : route === "register" ? (
          <Register
            loadUser={this.loadUser}
            onRouteChange={this.onRouteChange}
          />
        ) : (
          <div>
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries}
            />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onPictureSubmit={this.onPictureSubmit}
              question={quizQuestions[0].question}
            />
            <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
          </div>
        )}
      </div>
    );
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
