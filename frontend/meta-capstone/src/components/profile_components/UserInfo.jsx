import { Link } from 'react-router-dom';

function UserInfo({username, concerns, skinType}){
    return(
        <>
            <h2>{username}</h2>

            <p>your concern(s):</p>
            {concerns.map((concern) => (
                <p key={concern}>{concern}</p>
            ))}

            <p>your skin type(s):</p>
            {skinType.map((skinType) => (
                <p key={skinType}>{skinType}</p>
            ))}

            <Link to='/quiz'>✍️</Link>
        </>
    )
}
export default UserInfo;
