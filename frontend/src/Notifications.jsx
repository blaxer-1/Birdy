import { useState, useRef, useEffect } from "react";
import {
  Alert,
  Badge,
  Box,
  IconButton,
  Popper,
  Fade,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Stack
} from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import DeleteIcon from '@mui/icons-material/Delete';

import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
//import { toast } from "react-toastify";

export default function DescriptionAlerts() {
  const {
    notifications,
    clear,
    markAllAsRead,
    markAsRead,
    remove,
    unreadCount
  } = useNotificationCenter();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const toggleNotificationCenter = (event) => {
    setAnchorEl(event.currentTarget);
    setIsOpen(!isOpen);
  };

  const toggleFilter = (e) => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  //Click en dehors du centre de notifs
  const divRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && divRef.current && !divRef.current.contains(event.target) && !event.target.classList.contains("buttonNotifCenter") && !(event.target.tagName === "path")) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [divRef, setIsOpen, isOpen]);
  

  /*
  const types = ["success", "info", "warning", "error"];

  setInterval(() => {
     toast("Lorem ipsum dolor sit amet, consectetur adipiscing elit", {
      type: types[Math.floor(Math.random() * types.length)]
    });
   }, 2000);
   */
  
  return (
    <Box id="notification_zone" sx={{ margin: "8px" }}>
      <IconButton className="buttonNotifCenter" size="large" onClick={toggleNotificationCenter}>
        <Badge className="buttonNotifCenter" badgeContent={unreadCount} color="primary">
          <NotificationsIcon className="buttonNotifCenter" color="action" />
        </Badge>
      </IconButton>

      <Popper 
        ref={divRef}
        open={isOpen} 
        anchorEl={anchorEl} 
        popperOptions= {{
          placement: "bottom-end",
        }} 
        sx={{
          zIndex: 100,
        }}
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Box>
              <Box
                sx={{
                  background: "#666",
                  padding: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: "10px 10px 0 0",
                }}
              >
                <Typography variant="h5" color="#fff">
                  Notifications
                </Typography>
                <FormGroup sx={{ color: "#fff" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        color="secondary"
                        onChange={toggleFilter}
                        checked={showUnreadOnly}
                      />
                    }
                    label="Non lus uniquement"
                  />
                </FormGroup>
              </Box>
              <Stack
                sx={{
                  height: "300px",
                  width: "50ch",
                  padding: "12px",
                  background: "#f1f1f1",
                  overflowY: "auto"
                }}
                spacing={2}
              >
                {(!notifications.length ||
                  (unreadCount === 0 && showUnreadOnly)) && (
                  <h4 style={{
                    "textAlign": "center",
                  }}>
                    Aucune notification
                  </h4>
                )}
                {(showUnreadOnly
                  ? notifications.filter((v) => !v.read)
                  : notifications
                ).map((notification) => {
                  return (
                    <Fade in={true} key={notification.id} timeout={1000}>
                      <Alert
                        variant={
                          notification.read ? "standard" : "outlined"
                        }
                        sx = {
                          notification.read ? ({
                            "border": '1px solid transparent',
                            "boxSizing": "border-box",
                            "verticalAlign": "middle",
                            "alignItems": "center",
                          }) : ({
                            "boxSizing": "border-box",
                            "verticalAlign": "middle",
                            "alignItems": "center",
                          })
                        }
                        severity={(notification.type) || "info"}
                        action={
                          notification.read ? (
                            <div>
                              <IconButton
                                color="primary"
                                aria-label=""
                                component="span"
                                onClick={() => remove(notification.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </div>
                          ) : (
                            <IconButton
                              color="primary"
                              aria-label=""
                              component="span"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <MarkChatReadIcon />
                            </IconButton>
                          )
                        }
                      >
                        {notification.content}
                      </Alert>
                    </Fade>
                  );
                })}
              </Stack>
              <Box
                sx={{
                  background: "#666",
                  padding: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: "0 0 10px 10px",
                }}
              >
                <Button variant="contained" onClick={clear}>
                  Vider
                </Button>

                <Button variant="contained" onClick={markAllAsRead}>
                  Marquer comme lus
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}
