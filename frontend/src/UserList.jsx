import React from 'react'
import $ from 'jquery';
import API from './api';
import { toast } from "react-toastify";

class UserList extends React.Component {

    constructor(props) {
        super();

        this.followUser = this.followUser.bind(this);
        this.unfollowUser = this.unfollowUser.bind(this);
    }

    followUser(e, userId, login) {
        $("add_symbol_follow"+userId).addClass("rotating-infinite");
        $("add_symbol_follow"+userId).html("autorenew");

        API.post("/users/"+userId+"/follow")
        .then((res) => {
            toast.success("Vous suivez désormais @"+login, {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: "light",
            });

            $("add_symbol_follow"+userId).removeClass("rotating-infinite");
            $("add_symbol_follow"+userId).html("done");

            this.props.fetchUserDetails();
        })
        .catch((error) => {
            if (error && error.response && error.response.status && error.response.data && error.response.data.status && error.response.data.message) {
                toast.error(error.response.data.status+" | "+error.response.data.message, {
                   position: "top-left",
                   autoClose: 5000,
                   hideProgressBar: false,
                   closeOnClick: true,
                   pauseOnHover: true,
                   draggable: false,
                   progress: undefined,
                   theme: "light",
                });
            }
            console.error(error);
        });
    }

    unfollowUser(e, userId, login) {
        $("#remove_symbol_follow"+userId).addClass("rotating-infinite");
        $("#remove_symbol_follow"+userId).html("autorenew");

        API.post("/users/"+userId+"/unfollow", {})
        .then((res) => {
            toast.info("Vous ne suivez plus @"+login, {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: "light",
            });

            $("#remove_symbol_follow"+userId).removeClass("rotating-infinite");
            $("#remove_symbol_follow"+userId).html("done");

            this.props.fetchUserDetails();
        })
        .catch((error) => {
            if (error && error.response && error.response.status && error.response.data && error.response.data.status && error.response.data.message) {
                toast.error(error.response.data.status+" | "+error.response.data.message, {
                   position: "top-left",
                   autoClose: 5000,
                   hideProgressBar: false,
                   closeOnClick: true,
                   pauseOnHover: true,
                   draggable: false,
                   progress: undefined,
                   theme: "light",
                });
            }
            console.error(error);
        });
    }

    //TODO Followers
    render() {
        let members = [];

        if (this.props.type === "followings") {
            members = this.props.users.map((user) => {
                return (
                    <div className="user_from_list" key={user.userId}>
                        <div id="user_nickname">{user.login}</div>   

                        {
                            this.props.isMyProfile && (
                                <button 
                                    id="user_unfollow"
                                    className="btn btn-remove" 
                                    onClick={
                                        (e) => {
                                            this.unfollowUser(e, user.userId, user.login)
                                        }
                                    } 
                                    tabIndex={0}
                                >
                                    <span id="remove_symbol" className="remove material-symbols-outlined">remove</span>
                                </button>
                            )
                        }                     
                    </div>
                )
            })
        }

        if (this.props.type === "followers") {
            members = this.props.users.map((user) => {
                return (
                    <div className="user_from_list" key={user.userId}>
                        <div id="user_nickname">{user.login}</div>             
                    </div>
                )
            })
        }

        if (this.props.type === "search") {
            members = this.props.users.map((user) => {
                let isMeFollowingUser = this.props.userDetails.followings.find((user2) => {return user.userId === user2.userId})
                return (
                    <div className="user_from_list" key={user.userId}>
                        <div id="user_nickname">{user.login}</div>   
                        {
                            isMeFollowingUser ? (
                                <button 
                                    id="user_unfollow"
                                    className="btn btn-remove" 
                                    onClick={
                                        (e) => {
                                            this.unfollowUser(e, user.userId, user.login)
                                        }
                                    } 
                                    tabIndex={0}
                                >
                                    <span id={"remove_symbol_follow"+user.userId} className="icon-margin remove material-symbols-outlined">remove</span>
                                </button>
                            ) : (
                                <button 
                                    id="user_follow"
                                    className="btn btn-add" 
                                    onClick={
                                        (e) => {
                                            this.followUser(e, user.userId, user.login)
                                        }
                                    } 
                                    tabIndex={0}
                                >
                                    <span id={"add_symbol_follow"+user.userId} className="icon-margin add material-symbols-outlined">add</span>
                                </button>  
                            )
                        }                 
                    </div>
                )
            })
        }
        
        return (
            <div 
                className={this.props.className} 
                id="user_list"
            >
                <h4 id="user_list_title">{this.props.title}</h4>
                <div id="user_list_outer">
                    <div id="user_list_inner">
                        {members}
                    </div>
                </div>
            </div>
        )
    }
}

export default UserList;