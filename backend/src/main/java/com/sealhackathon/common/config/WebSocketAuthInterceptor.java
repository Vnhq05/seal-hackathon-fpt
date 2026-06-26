package com.sealhackathon.common.config;

import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.auth.security.UserPrincipal;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.ranking.service.LiveScoreService;
import com.sealhackathon.team.service.MentorChatService;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Pattern LEADERBOARD_TOPIC =
            Pattern.compile("^/topic/events/([0-9a-fA-F-]{36})/leaderboard$");

    private final JwtProvider jwtProvider;
    private final MentorChatService mentorChatService;
    private final LiveScoreService liveScoreService;

    public WebSocketAuthInterceptor(
            JwtProvider jwtProvider,
            @Lazy MentorChatService mentorChatService,
            LiveScoreService liveScoreService) {
        this.jwtProvider = jwtProvider;
        this.mentorChatService = mentorChatService;
        this.liveScoreService = liveScoreService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or invalid authentication token");
            }

            String token = authHeader.substring(7);
            if (!jwtProvider.validateToken(token)) {
                throw new IllegalArgumentException("Missing or invalid authentication token");
            }

            UUID userId = jwtProvider.getUserIdFromToken(token);
            String email = jwtProvider.getEmailFromToken(token);
            String role = jwtProvider.getRoleFromToken(token);

            UserPrincipal principal = new UserPrincipal(userId, email);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
            accessor.setUser(auth);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/mentor-chat/")) {
                UsernamePasswordAuthenticationToken auth =
                        (UsernamePasswordAuthenticationToken) accessor.getUser();
                if (auth == null) {
                    throw new IllegalArgumentException("Not authenticated");
                }

                UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
                UUID userId = principal.userId();

                String teamIdStr = destination.substring("/topic/mentor-chat/".length());
                UUID teamId = UUID.fromString(teamIdStr);

                if (!mentorChatService.hasAccessToTeamChat(userId, teamId)) {
                    throw new IllegalArgumentException("Not authorized to access this team's chat");
                }
            }

            if (destination != null) {
                Matcher leaderboardMatcher = LEADERBOARD_TOPIC.matcher(destination);
                if (leaderboardMatcher.matches()) {
                    UUID eventId = UUID.fromString(leaderboardMatcher.group(1));
                    liveScoreService.validateLeaderboardSubscription(eventId, resolveRole(accessor));
                }
            }
        }

        return message;
    }

    private Optional<UserType> resolveRole(StompHeaderAccessor accessor) {
        java.security.Principal principal = accessor.getUser();
        if (!(principal instanceof Authentication auth) || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .map(UserType::valueOf)
                .findFirst();
    }
}
